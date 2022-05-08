sub test()
    print "error"; err ' ko
    try
        doSomething()
    catch err
        print "error"; err ' ok
    end try
    print "error"; err ' ko
end sub

sub doSomething()
end sub
